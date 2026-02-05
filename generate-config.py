#!/usr/bin/env python3
"""
Generate config.js from .env file

Usage: python generate-config.py
"""

import os
from pathlib import Path

def main():
    script_dir = Path(__file__).parent
    env_file = script_dir / '.env'
    config_file = script_dir / 'config.js'

    if not env_file.exists():
        print("Error: .env file not found")
        print("Create one by copying .env.example to .env and adding your API keys")
        return 1

    # Parse .env file
    env_vars = {}
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()

    # Generate config.js
    config_content = f"""/**
 * Configuration file for API keys
 * Auto-generated from .env - DO NOT COMMIT
 */

window.CONFIG_KEYS = {{
    GOOGLE_MAPS_API_KEY: '{env_vars.get('GOOGLE_MAPS_API_KEY', '')}',
    LTA_API_KEY: '{env_vars.get('LTA_API_KEY', '')}'
}};
"""

    with open(config_file, 'w') as f:
        f.write(config_content)

    print(f"Generated {config_file}")
    return 0

if __name__ == '__main__':
    exit(main())
