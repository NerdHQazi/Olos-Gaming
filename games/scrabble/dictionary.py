import os
import json
import urllib.request
import urllib.error

class Dictionary:
    """
    Hybrid Scrabble Dictionary:
    1. Base Dictionary: Bundled dictionary.txt (83,600+ standard words) for instant offline lookup.
    2. Custom Dictionary: User-added custom_words.txt for personalized or new words.
    3. Online Dynamic API Fallback: Automatically checks public Dictionary APIs for newly coined words,
       validates them, and permanently caches them into custom_words.txt for offline use!
    """
    def __init__(self, dict_path=None, custom_path=None):
        base_dir = os.path.dirname(__file__)
        if dict_path is None:
            dict_path = os.path.join(base_dir, "dictionary.txt")
        if custom_path is None:
            custom_path = os.path.join(base_dir, "custom_words.txt")

        self.dict_path = dict_path
        self.custom_path = custom_path
        self.words = set()
        self.definitions_cache = {}

        # 1. Load Base Dictionary
        self.load_dictionary(self.dict_path)

        # 2. Load Custom Dictionary
        self.load_dictionary(self.custom_path)

    def load_dictionary(self, path):
        """Loads words from a text file into the in-memory set."""
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    w = line.strip().upper()
                    if w:
                        self.words.add(w)

    def add_custom_word(self, word: str, definition: str = "") -> bool:
        """Adds a new word dynamically to memory and saves it to custom_words.txt."""
        word = word.strip().upper()
        if not word or len(word) < 2:
            return False

        if word not in self.words:
            self.words.add(word)
            try:
                with open(self.custom_path, "a", encoding="utf-8") as f:
                    f.write(f"{word}\n")
            except Exception as e:
                print(f"Warning: Could not save custom word to {self.custom_path}: {e}")
        
        if definition:
            self.definitions_cache[word] = definition
        return True

    def is_valid_word(self, word: str, allow_online_lookup: bool = True) -> bool:
        """
        Checks if a word is valid.
        1. Fast set lookup in local memory.
        2. If not found and allow_online_lookup is True, performs an online lookup.
           If online API confirms it's a valid word, auto-saves to custom_words.txt!
        """
        if not word or len(word) < 2:
            return False

        w_upper = word.strip().upper()

        # Step 1: Check in-memory dictionary
        if w_upper in self.words:
            return True

        # Step 2: Online API Fallback lookup for new/modern words
        if allow_online_lookup:
            defn = self._online_lookup(w_upper)
            if defn:
                # Word exists! Auto-cache it dynamically for future offline play.
                self.add_custom_word(w_upper, definition=defn)
                return True

        return False

    def _online_lookup(self, word: str) -> str:
        """Queries Dictionary API to check if a word is valid and fetch definition."""
        try:
            url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word.lower()}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=1.5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    if data and isinstance(data, list):
                        meanings = data[0].get('meanings', [])
                        if meanings and 'definitions' in meanings[0]:
                            return meanings[0]['definitions'][0].get('definition', 'Valid English word.')
                        return "Valid English word."
        except Exception:
            pass  # Offline or word not found online
        return ""

    def get_definition(self, word: str) -> str:
        """Fetches definition from cache, online API, or NLTK fallback."""
        if not word:
            return ""

        w_upper = word.strip().upper()
        if w_upper in self.definitions_cache:
            return self.definitions_cache[w_upper]

        # Try Online API definition
        defn = self._online_lookup(w_upper)
        if defn:
            self.definitions_cache[w_upper] = defn
            return defn

        # Try NLTK WordNet fallback
        try:
            import nltk
            from nltk.corpus import wordnet
            synsets = wordnet.synsets(word.lower())
            if synsets:
                return synsets[0].definition()
        except Exception:
            pass

        return "No definition available."
