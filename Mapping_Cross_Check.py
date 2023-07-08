# Constant C
C = 426609638937

def calculate_Z(password):
    if not isinstance(password, str):
        raise ValueError("Input must be a string.")
    if not 10 <= len(password) <= 32:
        raise ValueError("Input string must be between 10 and 32 characters long.")

    # Replace all forms of typographical quotes with straight quotes
    password = password.replace('”', '"').replace('“', '"')

    # Calculate K as the sum of partition numbers of the characters
    K = 0
    for c in password:
        if c in lookup_table:
            mapped_value = lookup_table[c]
            print(f"Character: {c}, Mapped value: {mapped_value}")
            K += mapped_value
        else:
            raise ValueError(f"Character '{c}' not found in the lookup table.")

    print(f"Sum of mapped values (K): {K}")

    # Calculate Z
    Z = K + C

    return Z


# Ask the user for a password
password = input("Enter a password (10-32 characters): ")

# Call the function with the user's input
Z = calculate_Z(password)

# Print the result
print(f"\nHere is your password encoded in 'Avan's schema fella': {Z}")
