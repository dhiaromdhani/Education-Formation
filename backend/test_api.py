import unittest
from app import create_app

class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = create_app().test_client()

    def test_source_counts(self):
        self.assertEqual(self.client.get('/api/stats').get_json(),
                         {'classes':187, 'individus':186, 'personnes':22, 'organismes':15})

    def test_transitive_person_filter(self):
        rows = self.client.get('/api/personnes?type=Apprenant').get_json()
        self.assertIn('Firas', [r['id'] for r in rows])
        self.assertNotIn('Salma', [r['id'] for r in rows])

    def test_source_stage_hierarchy(self):
        rows = self.client.get('/api/organismes?type=Stage').get_json()
        self.assertIn('StagePFEWeb', [r['id'] for r in rows])
        self.assertNotIn('StackUnityTunisie', [r['id'] for r in rows])

    def test_details_and_incoming_links(self):
        detail = self.client.get('/api/organismes/StackUnityTunisie').get_json()
        self.assertTrue(any(r['direction']=='entrante' for r in detail['relations']))
        self.assertEqual(self.client.get('/api/personnes/StackUnityTunisie').status_code,404)

    def test_invalid_filters_and_literal_search(self):
        self.assertEqual(self.client.get('/api/personnes?type=Entreprise').status_code,400)
        self.assertEqual(self.client.get('/api/personnes',query_string={'q':'" } UNION { ?s ?p ?o }'}).get_json(),[])
        self.assertEqual(self.client.get('/api/personnes?q=AMIRA').get_json()[0]['id'],'Amira')

if __name__ == '__main__':
    unittest.main()
