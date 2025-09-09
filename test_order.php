<?php

// Test script untuk order processing
require 'vendor/autoload.php';

use Illuminate\Http\Request;
use App\Http\Controllers\Shop\CustomerOrderController;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Test order processing
echo "Starting order test...\n";

// Manual test dengan data yang ada
$controller = new CustomerOrderController();

// Create mock request
$request = Request::create('/customer/process-order', 'POST', [
    'delivery_option' => 'pickup',
    'metode_pembayaran' => 'tunai',
    'catatan' => 'Test order from script'
]);

try {
    $response = $controller->processOrder($request);
    echo "SUCCESS: Order processed\n";
    echo "Response: " . json_encode($response) . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "File: " . $e->getFile() . "\n";
}
