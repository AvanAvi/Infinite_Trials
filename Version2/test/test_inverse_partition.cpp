#include <gtest/gtest.h>

#include "inverse_partition.h"

namespace {

TEST(InversePartitionTest, KnownValueP100) {
    auto n = invertPartition("190569292");
    ASSERT_TRUE(n.has_value());
    EXPECT_EQ(*n, 100u);
}

TEST(InversePartitionTest, KnownValueP200) {
    auto n = invertPartition("3972999029388");
    ASSERT_TRUE(n.has_value());
    EXPECT_EQ(*n, 200u);
}

TEST(InversePartitionTest, KnownValueP1000) {
    auto n = invertPartition("24061467864032622473692149727991");
    ASSERT_TRUE(n.has_value());
    EXPECT_EQ(*n, 1000u);
}

TEST(InversePartitionTest, SmallestNForAmbiguousValue) {
    // p(0) == p(1) == 1; the smallest matching n must be returned.
    auto n = invertPartition("1");
    ASSERT_TRUE(n.has_value());
    EXPECT_EQ(*n, 0u);
}

TEST(InversePartitionTest, NotAPartitionNumber) {
    // Falls strictly between p(100) and p(101); matches no n.
    auto n = invertPartition("190569293");
    EXPECT_FALSE(n.has_value());
}

TEST(InversePartitionTest, ZeroIsNotAPartitionNumber) {
    auto n = invertPartition("0");
    EXPECT_FALSE(n.has_value());
}

TEST(InversePartitionTest, RejectsNonDecimalInput) {
    EXPECT_THROW(invertPartition("12a34"), std::invalid_argument);
    EXPECT_THROW(invertPartition("-5"), std::invalid_argument);
    EXPECT_THROW(invertPartition(""), std::invalid_argument);
}

TEST(InversePartitionTest, PartitionTableMatchesKnownValues) {
    auto table = computePartitionTable(10);
    // p(0)..p(10) per OEIS A000041.
    const std::vector<unsigned long> expected = {1, 1, 2, 3, 5, 7, 11, 15, 22, 30, 42};
    ASSERT_EQ(table.size(), expected.size());
    for (size_t i = 0; i < expected.size(); ++i) {
        EXPECT_EQ(table[i], mpz_class(expected[i])) << "mismatch at n=" << i;
    }
}

}  // namespace
