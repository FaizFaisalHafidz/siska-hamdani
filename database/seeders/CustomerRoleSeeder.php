<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CustomerRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create customer role if not exists
        if (!Role::where('name', 'customer')->exists()) {
            $customerRole = Role::create(['name' => 'customer']);

            // Create customer-specific permissions
            $permissions = [
                'view products',
                'add to cart', 
                'place order',
                'view own orders',
                'update own profile',
            ];

            foreach ($permissions as $permission) {
                if (!Permission::where('name', $permission)->exists()) {
                    Permission::create(['name' => $permission]);
                }
            }

            // Assign permissions to customer role
            $customerRole->syncPermissions($permissions);
        }
    }
}
