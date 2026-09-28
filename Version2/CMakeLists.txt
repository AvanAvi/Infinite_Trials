cmake_minimum_required(VERSION 3.14)
project(InfiniteTrialsV2 CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

add_compile_options(-Wall -Wextra -Wpedantic)

find_path(GMP_INCLUDE_DIR NAMES gmp.h)
find_library(GMP_LIBRARY NAMES gmp)
find_library(GMPXX_LIBRARY NAMES gmpxx)

if(NOT GMP_INCLUDE_DIR OR NOT GMP_LIBRARY OR NOT GMPXX_LIBRARY)
    message(FATAL_ERROR "GMP with C++ bindings (gmpxx) not found. Install libgmp-dev (Linux) or 'brew install gmp' (macOS).")
endif()

add_library(partition_core
    src/partition_encryption.cpp
    src/backtracking_strategy.cpp
    src/mitm_strategy.cpp
    src/inverse_partition.cpp
)

target_include_directories(partition_core
    PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}/include
        ${GMP_INCLUDE_DIR}
)

target_link_libraries(partition_core
    PUBLIC
        ${GMP_LIBRARY}
        ${GMPXX_LIBRARY}
)

option(BUILD_TESTING_INFINITE_TRIALS "Build tests for Infinite Trials V2" ON)

if(BUILD_TESTING_INFINITE_TRIALS)
    include(FetchContent)
    FetchContent_Declare(
        googletest
        GIT_REPOSITORY https://github.com/google/googletest.git
        GIT_TAG v1.14.0
    )
    set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
    set(INSTALL_GTEST OFF CACHE BOOL "" FORCE)
    FetchContent_MakeAvailable(googletest)

    enable_testing()

    add_executable(partition_tests
        test/test_partition_encryption.cpp
        test/test_backtracking_strategy.cpp
        test/test_mitm_strategy.cpp
        test/test_inverse_partition.cpp
    )

    target_link_libraries(partition_tests
        PRIVATE
            partition_core
            GTest::gtest_main
    )

    target_compile_definitions(partition_tests
        PRIVATE
            LOOKUP_TABLE_PATH="${CMAKE_CURRENT_SOURCE_DIR}/data/lookup_table.csv"
    )

    include(GoogleTest)
    gtest_discover_tests(partition_tests)
endif()

add_executable(partition_benchmark
    test/benchmark.cpp
)

target_link_libraries(partition_benchmark
    PRIVATE
        partition_core
)

target_compile_definitions(partition_benchmark
    PRIVATE
        LOOKUP_TABLE_PATH="${CMAKE_CURRENT_SOURCE_DIR}/data/lookup_table.csv"
)

add_executable(inverse_partition
    tools/inverse_partition_main.cpp
)

target_link_libraries(inverse_partition
    PRIVATE
        partition_core
)
