"""Stockage local partagé. Un seul processus Flask ; Protégé reste un éditeur externe."""
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
import os
import tempfile
import threading
from uuid import uuid4
from rdflib import Graph

class InvalidOntology(Exception):
    pass

class RevisionConflict(Exception):
    pass

class OntologyStore:
    def __init__(self, path):
        self.path = Path(path).resolve()
        self.lock = threading.RLock()
        self.graph = None
        self.revision = None

    def reload(self):
        try:
            data = self.path.read_bytes()
            revision = sha256(data).hexdigest()
            if revision != self.revision:
                candidate = Graph().parse(data=data, format='turtle')
                if len(candidate) == 0:
                    raise ValueError('Empty graph')
                self.graph, self.revision = candidate, revision
        except Exception as exc:
            raise InvalidOntology('Le fichier Turtle est absent ou invalide. Terminez la sauvegarde dans Protégé puis réessayez.') from exc
        return self.graph

    def save(self, graph, expected):
        if not expected or expected != self.revision:
            raise RevisionConflict('Les données ont changé. Fermez puis rouvrez le formulaire avant de réessayer.')
        original = self.path.read_bytes()
        if sha256(original).hexdigest() != expected:
            raise RevisionConflict('Le fichier a été modifié par un autre outil. Rechargez les données.')
        data = graph.serialize(format='turtle', encoding='utf-8')
        # Valider avant le remplacement ; garder les anciens octets pour restauration.
        Graph().parse(data=data, format='turtle')
        backup_dir = self.path.parent / 'backups'
        backup_dir.mkdir(exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%f')
        (backup_dir / f'formation-{stamp}-{uuid4().hex[:6]}.ttl').write_bytes(original)
        fd, temp = tempfile.mkstemp(prefix='.formation-', suffix='.tmp', dir=self.path.parent)
        try:
            with os.fdopen(fd, 'wb') as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            if sha256(self.path.read_bytes()).hexdigest() != expected:
                raise RevisionConflict('Sauvegarde externe détectée. Rechargez les données.')
            os.replace(temp, self.path)
        finally:
            if os.path.exists(temp):
                os.unlink(temp)
        self.graph, self.revision = graph, sha256(data).hexdigest()
        return self.revision

