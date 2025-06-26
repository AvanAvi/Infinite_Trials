#include "partition_encryption.h"
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <iostream>
#include <algorithm>

PartitionEncryption::PartitionEncryption(const std::string& lookupTablePath) {
    // Initialize constants
    constantC = mpz_class("426609638937"); // Large constant as mentioned in README
    minPasswordLength = 1;
    maxPasswordLength = 20; // Reasonable limit for performance
    
    // Load the lookup table
    loadLookupTable(lookupTablePath);
    
    std::cout << "Partition Encryption System initialized with " 
              << charToPartition.size() << " characters." << std::endl;
}

void PartitionEncryption::loadLookupTable(const std::string& filePath) {
    std::ifstream file(filePath);
    if (!file.is_open()) {
        throw std::runtime_error("Could not open lookup table file: " + filePath);
    }
    
    std::string line;
    bool headerSkipped = false;
    
    while (std::getline(file, line)) {
        // Skip header line
        if (!headerSkipped) {
            headerSkipped = true;
            continue;
        }
        
        // Skip empty lines
        if (line.empty()) {
            continue;
        }
        
        // Parse CSV line: character,partition_value
        std::istringstream ss(line);
        std::string characterStr, partitionValueStr;
        
        if (std::getline(ss, characterStr, ',') && std::getline(ss, partitionValueStr)) {
            if (!characterStr.empty()) {
                char character = characterStr[0];
                mpz_class partitionValue(partitionValueStr);
                
                charToPartition[character] = partitionValue;
                partitionToChar[partitionValue] = character;
            }
        }
    }
    
    file.close();
    
    if (charToPartition.empty()) {
        throw std::runtime_error("No valid entries found in lookup table file");
    }
    
    std::cout << "Loaded " << charToPartition.size() 
              << " character-to-partition mappings." << std::endl;
}

void PartitionEncryption::validatePassword(const std::string& password) const {
    if (password.length() < minPasswordLength) {
        throw std::invalid_argument("Password too short. Minimum length: " + 
                                  std::to_string(minPasswordLength));
    }
    
    if (password.length() > maxPasswordLength) {
        throw std::invalid_argument("Password too long. Maximum length: " + 
                                  std::to_string(maxPasswordLength));
    }
    
    // Check if all characters are in the lookup table
    for (char c : password) {
        if (charToPartition.find(c) == charToPartition.end()) {
            throw std::invalid_argument("Character '" + std::string(1, c) + 
                                      "' not found in lookup table");
        }
    }
}

mpz_class PartitionEncryption::encrypt(const std::string& password) {
    validatePassword(password);
    
    mpz_class K = 0;
    
    // Sum partition numbers for each character
    for (char c : password) {
        auto it = charToPartition.find(c);
        if (it != charToPartition.end()) {
            K += it->second;
        }
    }
    
    // Add constant C to get final encrypted value Z
    mpz_class Z = K + constantC;
    
    std::cout << "Password encrypted successfully." << std::endl;
    std::cout << "K (sum of partitions): " << K.get_str() << std::endl;
    std::cout << "Z (final encrypted value): " << Z.get_str() << std::endl;
    
    return Z;
}

std::vector<std::string> PartitionEncryption::decrypt(
    const mpz_class& encryptedValue, 
    std::shared_ptr<DecryptionStrategy> strategy) {
    
    if (!strategy) {
        throw std::invalid_argument("Strategy cannot be null");
    }
    
    // Calculate K = Z - C
    mpz_class K = encryptedValue - constantC;
    
    if (K < 0) {
        std::cout << "Invalid encrypted value: K would be negative." << std::endl;
        return {};
    }
    
    std::cout << "Starting decryption using " << strategy->getName() << " strategy..." << std::endl;
    std::cout << "Target K value: " << K.get_str() << std::endl;
    
    auto startTime = std::chrono::high_resolution_clock::now();
    
    // Use the strategy to decrypt
    std::vector<std::string> results = strategy->decrypt(
        K, charToPartition, minPasswordLength, maxPasswordLength);
    
    auto endTime = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);
    
    std::cout << "Decryption completed in " << duration.count() << " ms." << std::endl;
    std::cout << "Found " << results.size() << " possible solution(s)." << std::endl;
    
    if (!results.empty()) {
        std::cout << "Solutions:" << std::endl;
        for (size_t i = 0; i < results.size(); ++i) {
            std::cout << "  " << (i + 1) << ". \"" << results[i] << "\"" << std::endl;
        }
    }
    
    // Display performance metrics
    std::cout << strategy->getPerformanceMetrics() << std::endl;
    
    return results;
}

std::string DecryptionStrategy::getPerformanceMetrics() const {
    double durationMs = duration.count() / 1000.0;
    double memoryKB = memoryUsed / 1024.0;
    
    std::string metrics = "Performance Metrics:\n";
    metrics += "  Duration: " + std::to_string(durationMs) + " ms\n";
    metrics += "  Combinations checked: " + std::to_string(combinationsChecked) + "\n";
    metrics += "  Memory used: " + std::to_string(memoryKB) + " KB\n";
    
    return metrics;
}