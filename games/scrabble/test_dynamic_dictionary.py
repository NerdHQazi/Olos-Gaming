import os
import unittest
from dictionary import Dictionary

class TestDynamicDictionary(unittest.TestCase):

    def setUp(self):
        self.custom_path = os.path.join(os.path.dirname(__file__), "test_custom_words.txt")
        if os.path.exists(self.custom_path):
            os.remove(self.custom_path)
        self.dict = Dictionary(custom_path=self.custom_path)

    def tearDown(self):
        if os.path.exists(self.custom_path):
            os.remove(self.custom_path)

    def test_base_dictionary_lookup(self):
        self.assertTrue(self.dict.is_valid_word("CAT"))
        self.assertTrue(self.dict.is_valid_word("SCRABBLE"))

    def test_add_custom_word(self):
        # Word not in base dictionary
        self.assertFalse(self.dict.is_valid_word("OLOSGAMING", allow_online_lookup=False))

        # Add custom word
        success = self.dict.add_custom_word("OLOSGAMING", definition="Awesome gaming platform.")
        self.assertTrue(success)
        self.assertTrue(self.dict.is_valid_word("OLOSGAMING"))
        self.assertEqual(self.dict.get_definition("OLOSGAMING"), "Awesome gaming platform.")

        # Reload dictionary from disk and check persistence in custom_words.txt
        new_dict = Dictionary(custom_path=self.custom_path)
        self.assertTrue(new_dict.is_valid_word("OLOSGAMING"))

    def test_online_dynamic_lookup_and_auto_caching(self):
        # "SELFIE" is a modern word
        valid = self.dict.is_valid_word("SELFIE", allow_online_lookup=True)
        self.assertTrue(valid)
        # Should be auto-added to custom_words file for future offline use
        self.assertTrue(os.path.exists(self.custom_path))

if __name__ == "__main__":
    unittest.main()
