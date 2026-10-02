# Data

This folder owns the on-device data contract. `database.ts` initializes SQLite, the two repository modules provide CRUD access for finance and health, and `types.ts` defines the records shared by storage, forms, and screens. The repository boundaries are the intended place to add future API adapters.