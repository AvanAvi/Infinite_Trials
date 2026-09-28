#include <gtest/gtest.h>
#include "partition_encryption.h"

namespace {

class PartitionEncryptionTest : public ::testing::Test {
protected:
    PartitionEncryption system{LOOKUP_TABLE_PATH};
};

TEST_F(PartitionEncryptionTest, LoadsAllTableEntries) {
    EXPECT_EQ(system.getLookupTable().size(), 62u);
}

TEST_F(PartitionEncryptionTest, EncryptionIsDeterministic) {
    mpz_class z1 = system.encrypt("hello");
    mpz_class z2 = system.encrypt("hello");
    EXPECT_EQ(z1, z2);
}

TEST_F(PartitionEncryptionTest, DifferentPasswordsProduceDifferentZ) {
    mpz_class z1 = system.encrypt("abcde");
    mpz_class z2 = system.encrypt("fghij");
    EXPECT_NE(z1, z2);
}

TEST_F(PartitionEncryptionTest, ZIncludesConstantC) {
    mpz_class z = system.encrypt("a");
    EXPECT_EQ(z, system.getConstantC() + system.getLookupTable().at('a'));
}

TEST_F(PartitionEncryptionTest, RejectsUnknownCharacter) {
    EXPECT_THROW(system.encrypt("hello!"), std::invalid_argument);
}

TEST_F(PartitionEncryptionTest, RejectsEmptyPassword) {
    EXPECT_THROW(system.encrypt(""), std::invalid_argument);
}

TEST_F(PartitionEncryptionTest, RejectsPasswordLongerThanMax) {
    EXPECT_THROW(system.encrypt(std::string(21, 'a')), std::invalid_argument);
}

TEST_F(PartitionEncryptionTest, AcceptsPasswordAtMaxLength) {
    EXPECT_NO_THROW(system.encrypt(std::string(20, 'a')));
}

}  // namespace
