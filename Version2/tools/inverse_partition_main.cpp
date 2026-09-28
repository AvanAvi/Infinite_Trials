#include <iostream>
#include <stdexcept>
#include <string>

#include "inverse_partition.h"

int main(int argc, char** argv) {
    std::string input;

    if (argc > 1) {
        input = argv[1];
    } else {
        std::cout << "Enter the partition number p(n): ";
        std::cin >> input;
    }

    try {
        auto n = invertPartition(input);
        if (n) {
            std::cout << "n = " << *n << std::endl;
        } else {
            std::cout << input << " is not a partition number." << std::endl;
        }
    } catch (const std::invalid_argument& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
