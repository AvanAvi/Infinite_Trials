#include <gtest/gtest.h>
#include <algorithm>
#include <memory>
#include <vector>

#include "partition_encryption.h"
#include "backtracking_strategy.h"

namespace {

std::string canonical(const std::string& s) {
    std::string sorted = s;
    std::sort(sorted.begin(), sorted.end());
    return sorted;
}

class BacktrackingStrategyTest : public ::testing::Test {
protected:
    PartitionEncryption system{LOOKUP_TABLE_PATH};
};

TEST_F(BacktrackingStrategyTest, FindsOriginalMultisetForShortPasswords) {
    const std::vector<std::string> passwords = {"a", "ab", "cab", "face"};

    for (const auto& password : passwords) {
        mpz_class z = system.encrypt(password);

        auto strategy = std::make_shared<BacktrackingStrategy>(true, 0);
        std::vector<std::string> results = system.decrypt(z, strategy);

        EXPECT_FALSE(results.empty()) << "no solutions found for \"" << password << "\"";
        EXPECT_NE(std::find(results.begin(), results.end(), canonical(password)), results.end())
            << "expected multiset \"" << canonical(password) << "\" not found for \"" << password
            << "\"";
    }
}

TEST_F(BacktrackingStrategyTest, EveryResultReencryptsToTargetZ) {
    mpz_class z = system.encrypt("face");

    auto strategy = std::make_shared<BacktrackingStrategy>(true, 0);
    std::vector<std::string> results = system.decrypt(z, strategy);

    ASSERT_FALSE(results.empty());
    for (const auto& candidate : results) {
        EXPECT_EQ(system.encrypt(candidate), z)
            << "candidate \"" << candidate << "\" does not re-encrypt to the target";
    }
}

TEST_F(BacktrackingStrategyTest, ResultsAreCanonicalNonDecreasingOrder) {
    mpz_class z = system.encrypt("face");

    auto strategy = std::make_shared<BacktrackingStrategy>(true, 0);
    std::vector<std::string> results = system.decrypt(z, strategy);

    ASSERT_FALSE(results.empty());
    for (const auto& candidate : results) {
        EXPECT_EQ(candidate, canonical(candidate))
            << "\"" << candidate << "\" is not in canonical non-decreasing order";
    }
}

TEST_F(BacktrackingStrategyTest, ResultsContainNoDuplicates) {
    mpz_class z = system.encrypt("face");

    auto strategy = std::make_shared<BacktrackingStrategy>(true, 0);
    std::vector<std::string> results = system.decrypt(z, strategy);

    std::vector<std::string> unique = results;
    std::sort(unique.begin(), unique.end());
    unique.erase(std::unique(unique.begin(), unique.end()), unique.end());

    EXPECT_EQ(results.size(), unique.size());
}

}  // namespace
