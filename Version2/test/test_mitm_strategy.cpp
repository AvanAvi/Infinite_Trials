#include <gtest/gtest.h>
#include <algorithm>
#include <memory>
#include <vector>

#include "partition_encryption.h"
#include "mitm_strategy.h"
#include "backtracking_strategy.h"

namespace {

std::string canonical(const std::string& s) {
    std::string sorted = s;
    std::sort(sorted.begin(), sorted.end());
    return sorted;
}

class MitmStrategyTest : public ::testing::Test {
protected:
    PartitionEncryption system{LOOKUP_TABLE_PATH};
};

TEST_F(MitmStrategyTest, FindsOriginalMultisetForShortPasswords) {
    const std::vector<std::string> passwords = {"a", "ab", "cab", "face"};

    for (const auto& password : passwords) {
        mpz_class z = system.encrypt(password);

        auto strategy = std::make_shared<MeetInTheMiddleStrategy>();
        std::vector<std::string> results = system.decrypt(z, strategy);

        EXPECT_FALSE(results.empty()) << "no solutions found for \"" << password << "\"";
        EXPECT_NE(std::find(results.begin(), results.end(), canonical(password)), results.end())
            << "expected multiset \"" << canonical(password) << "\" not found for \"" << password
            << "\"";
    }
}

TEST_F(MitmStrategyTest, EveryResultReencryptsToTargetZ) {
    mpz_class z = system.encrypt("face");

    auto strategy = std::make_shared<MeetInTheMiddleStrategy>();
    std::vector<std::string> results = system.decrypt(z, strategy);

    ASSERT_FALSE(results.empty());
    for (const auto& candidate : results) {
        EXPECT_EQ(system.encrypt(candidate), z)
            << "candidate \"" << candidate << "\" does not re-encrypt to the target";
    }
}

TEST_F(MitmStrategyTest, ResultsAreCanonicalNonDecreasingOrder) {
    mpz_class z = system.encrypt("face");

    auto strategy = std::make_shared<MeetInTheMiddleStrategy>();
    std::vector<std::string> results = system.decrypt(z, strategy);

    ASSERT_FALSE(results.empty());
    for (const auto& candidate : results) {
        EXPECT_EQ(candidate, canonical(candidate))
            << "\"" << candidate << "\" is not in canonical non-decreasing order";
    }
}

TEST_F(MitmStrategyTest, ResultsContainNoDuplicates) {
    mpz_class z = system.encrypt("face");

    auto strategy = std::make_shared<MeetInTheMiddleStrategy>();
    std::vector<std::string> results = system.decrypt(z, strategy);

    std::vector<std::string> unique = results;
    std::sort(unique.begin(), unique.end());
    unique.erase(std::unique(unique.begin(), unique.end()), unique.end());

    EXPECT_EQ(results.size(), unique.size());
}

TEST_F(MitmStrategyTest, AgreesWithBacktrackingResultSet) {
    mpz_class z = system.encrypt("cab");

    auto mitm = std::make_shared<MeetInTheMiddleStrategy>();
    std::vector<std::string> mitmResults = system.decrypt(z, mitm);
    std::sort(mitmResults.begin(), mitmResults.end());

    auto backtracking = std::make_shared<BacktrackingStrategy>(true, 0);
    std::vector<std::string> backtrackingResults = system.decrypt(z, backtracking);
    std::sort(backtrackingResults.begin(), backtrackingResults.end());

    // Two independently-implemented strategies over the same multiset space
    // must find exactly the same solutions.
    EXPECT_EQ(mitmResults, backtrackingResults);
}

}  // namespace
