"""API locale : consultation, ajout/modification et synchronisation du fichier Turtle."""
from pathlib import Path
from datetime import date
import os
import re
from uuid import uuid4
from ontology_store import OntologyStore, InvalidOntology, RevisionConflict
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF, RDFS, OWL, XSD

EDU = Namespace('http://stackunity.org/education#')
PREFIX = '''PREFIX edu: <http://stackunity.org/education#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
'''
ROOTS = {'personnes': EDU.Personne, 'organismes': EDU.Organisme}

def local(node):
    return str(node).rsplit('#', 1)[-1]

def create_app(ontology_path=None):
    app = Flask(__name__)
    CORS(app, resources={r'/api/*': {'origins': ['http://localhost:5173', 'http://127.0.0.1:5173']}})
    app.config['MAX_CONTENT_LENGTH'] = 64 * 1024
    store = OntologyStore(ontology_path or os.environ.get('ONTOLOGY_PATH') or Path(__file__).parent / 'data/formation.ttl')
    graph = None

    @app.before_request
    def refresh_graph():
        nonlocal graph
        store.lock.acquire()
        g.ontology_locked = True
        try:
            graph = store.reload()
        except InvalidOntology as exc:
            return jsonify(error=str(exc)), 503

    @app.teardown_request
    def release_graph(_error):
        if getattr(g, 'ontology_locked', False):
            g.ontology_locked = False
            store.lock.release()

    @app.after_request
    def no_cache(response):
        response.headers['Cache-Control'] = 'no-store'
        return response

    @app.errorhandler(RevisionConflict)
    def conflict(exc):
        return jsonify(error=str(exc)), 409

    @app.errorhandler(OSError)
    def storage_error(exc):
        app.logger.error('Écriture du fichier impossible : %s', exc)
        return jsonify(error='Écriture impossible. Vérifiez le chemin du fichier et les permissions.'), 503

    def label(node):
        return str(graph.value(node, EDU.nom) or graph.value(node, RDFS.label) or local(node))

    def classes(root):
        rows = graph.query(PREFIX + '''SELECT DISTINCT ?c WHERE {
            ?c a owl:Class ; rdfs:subClassOf* ?root .
        } ORDER BY ?c''', initBindings={'root': root})
        return [{'id': local(r.c), 'label': label(r.c),
                 'parent': [local(p) for p in graph.objects(r.c, RDFS.subClassOf) if isinstance(p, URIRef)]} for r in rows]

    def records(root):
        rows = graph.query(PREFIX + '''SELECT DISTINCT ?s WHERE {
            ?s a owl:NamedIndividual ; a ?type .
            ?type rdfs:subClassOf* ?root .
        } ORDER BY ?s''', initBindings={'root': root})
        result = []
        for r in rows:
            s = r.s
            result.append({'id': local(s), 'uri': str(s), 'nom': label(s),
                'types': sorted(local(t) for t in graph.objects(s, RDF.type) if t != OWL.NamedIndividual),
                'email': str(graph.value(s, EDU.email) or ''),
                'telephone': str(graph.value(s, EDU.telephone) or ''),
                'ville': str(graph.value(s, EDU.ville) or ''),
                'secteurActivite': str(graph.value(s, EDU.secteurActivite) or '')})
        return result

    @app.get('/api/health')
    def health():
        return jsonify(status='ok', triples=len(graph), revision=store.revision)

    @app.get('/api/schema')
    def schema():
        return jsonify({key: classes(root) for key, root in ROOTS.items()})

    @app.get('/api/stats')
    def stats():
        return jsonify(personnes=len(records(EDU.Personne)), organismes=len(records(EDU.Organisme)),
            classes=len(set(graph.subjects(RDF.type, OWL.Class))),
            individus=len(set(graph.subjects(RDF.type, OWL.NamedIndividual))))

    @app.get('/api/<module>')
    def listing(module):
        if module not in ROOTS:
            return jsonify(error='Module introuvable'), 404
        root = ROOTS[module]
        type_id = request.args.get('type', '')
        if type_id and type_id not in {c['id'] for c in classes(root)}:
            return jsonify(error='Classe inconnue pour ce module'), 400
        query = request.args.get('q', '').strip().casefold()
        result = []
        for row in records(root):
            # Le filtre inclut les descendants de la classe sélectionnée.
            if type_id and not any((EDU[t], RDFS.subClassOf * '*', EDU[type_id]) in graph for t in row['types']):
                continue
            if query and query not in ' '.join([row['nom'], row['email'], row['ville'], row['secteurActivite']]).casefold():
                continue
            result.append(row)
        return jsonify(result)

    @app.get('/api/<module>/<identifier>')
    def detail(module, identifier):
        if module not in ROOTS:
            return jsonify(error='Module introuvable'), 404
        record = next((r for r in records(ROOTS[module]) if r['id'] == identifier), None)
        if record is None:
            return jsonify(error='Individu introuvable'), 404
        subject = EDU[identifier]
        attributes, links = [], []
        for p, o in graph.predicate_objects(subject):
            if p == RDF.type:
                continue
            item = {'property': local(p), 'label': label(p), 'value': str(o)}
            if isinstance(o, URIRef):
                item.update(target=local(o), targetLabel=label(o), direction='sortante')
                links.append(item)
            else:
                attributes.append(item)
        # Les relations entrantes rendent visibles les liens gérés par les autres membres.
        for s, p in graph.subject_predicates(subject):
            if (s, RDF.type, OWL.NamedIndividual) in graph:
                links.append({'property': local(p), 'label': label(p), 'value': str(s),
                              'target': local(s), 'targetLabel': label(s), 'direction': 'entrante'})
        record.update(revision=store.revision, attributes=sorted(attributes, key=lambda x:x['property']),
                      relations=sorted(links, key=lambda x:(x['direction'],x['property'],x['value'])))
        return jsonify(record)
    # Les champs modifiables ne touchent jamais aux relations, classes ni autres attributs.
    FIELDS = {
        'personnes': {'nom': XSD.string, 'email': XSD.string, 'telephone': XSD.string,
                      'dateNaissance': XSD.date, 'niveauMaitrise': XSD.integer},
        'organismes': {'nom': XSD.string, 'ville': XSD.string, 'secteurActivite': XSD.string},
    }

    def validate_fields(module, body, creating):
        values = body.get('fields')
        if not isinstance(values, dict) or not values:
            raise ValueError('Le formulaire doit contenir des champs.')
        if set(values) - FIELDS[module].keys():
            raise ValueError('Champ non autorisé pour ce module.')
        if creating and not str(values.get('nom', '')).strip():
            raise ValueError('Le nom est obligatoire.')
        result = {}
        for name, value in values.items():
            if not isinstance(value, str) or len(value) > 500:
                raise ValueError('Chaque champ doit être un texte de 500 caractères maximum.')
            value = value.strip()
            if name == 'nom' and not value:
                raise ValueError('Le nom est obligatoire.')
            if name == 'email' and value and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', value):
                raise ValueError('Adresse email invalide.')
            if name == 'dateNaissance' and value:
                date.fromisoformat(value)
            if name == 'niveauMaitrise' and value and not re.fullmatch(r'[+-]?\d+', value):
                raise ValueError('Le niveau de maîtrise doit être un entier.')
            result[name] = Literal(value, datatype=FIELDS[module][name]) if value else None
        return result

    def write_record(module, identifier=None):
        if module not in ROOTS:
            return jsonify(error='Module introuvable'), 404
        if not request.is_json:
            return jsonify(error='Un objet JSON est attendu.'), 400
        body = request.get_json(silent=True)
        if not isinstance(body, dict):
            return jsonify(error='Un objet JSON est attendu.'), 400
        if body.get('revision') != store.revision:
            raise RevisionConflict('Les données ont changé. Fermez puis rouvrez le formulaire.')
        creating = identifier is None
        try:
            fields = validate_fields(module, body, creating)
            if creating:
                class_id = body.get('type')
                if class_id not in {c['id'] for c in classes(ROOTS[module])}:
                    raise ValueError('Classe inconnue pour ce module.')
                identifier = ('Personne_' if module == 'personnes' else 'Organisme_') + uuid4().hex
            elif not any(r['id'] == identifier for r in records(ROOTS[module])):
                return jsonify(error='Individu introuvable'), 404
        except (ValueError, TypeError) as exc:
            return jsonify(error=str(exc)), 400
        subject = EDU[identifier]
        candidate = Graph()
        for prefix, ns in graph.namespaces():
            candidate.bind(prefix, ns)
        for triple in graph:
            candidate.add(triple)
        if creating:
            candidate.add((subject, RDF.type, OWL.NamedIndividual))
            candidate.add((subject, RDF.type, EDU[class_id]))
        for name, value in fields.items():
            # Un formulaire simple ne doit pas écraser plusieurs valeurs existantes.
            if not creating and len(list(candidate.objects(subject, EDU[name]))) > 1:
                return jsonify(error=f'{name} comporte plusieurs valeurs : éditez ce champ dans Protégé.'), 409
            candidate.remove((subject, EDU[name], None))
            if value is not None:
                candidate.add((subject, EDU[name], value))
        revision = store.save(candidate, body['revision'])
        return jsonify(id=identifier, revision=revision, message='Enregistré dans le fichier partagé avec Protégé.'), (201 if creating else 200)

    @app.post('/api/<module>')
    def create_record(module):
        return write_record(module)

    @app.patch('/api/<module>/<identifier>')
    def edit_record(module, identifier):
        return write_record(module, identifier)

    return app

if __name__ == '__main__':
    create_app().run(host='127.0.0.1', port=5000, debug=True, use_reloader=False)

