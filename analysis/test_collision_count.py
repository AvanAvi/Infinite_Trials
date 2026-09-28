import os
import unittest

from collision_count import compute_k, count_multisets_with_sum, load_lookup_table

TABLE_PATH = os.path.join(os.path.dirname(__file__), "..", "Version2", "data", "lookup_table.csv")


class CollisionCountTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.table = load_lookup_table(TABLE_PATH)
        cls.values = sorted(cls.table.values())

    def collisions_for(self, password):
        k = compute_k(password, self.table)
        return count_multisets_with_sum(self.values, len(password), k)

    def test_ab_has_no_collisions(self):
        # a=1, b=2 is the only pair of distinct table values summing to 3.
        self.assertEqual(self.collisions_for("ab"), 1)

    def test_cab_has_no_collisions(self):
        self.assertEqual(self.collisions_for("cab"), 1)

    def test_face_has_five_other_collisions(self):
        # Cross-checked independently against BacktrackingStrategy's
        # length-4 results for the same K: both found 6.
        self.assertEqual(self.collisions_for("face"), 6)

    def test_unknown_character_raises(self):
        with self.assertRaises(ValueError):
            compute_k("face!", self.table)


if __name__ == "__main__":
    unittest.main()
