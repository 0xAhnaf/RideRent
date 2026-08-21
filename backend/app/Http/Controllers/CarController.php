<?php

namespace App\Http\Controllers;

use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Throwable;

class CarController extends Controller
{
    public function index()
    {
        return response()->json(Car::all());
    }

    public function show($id)
    {
        $vehicle = Car::find($id);

        if (!$vehicle) {
            return response()->json([
                'message' => 'Vehicle not found.',
            ], 404);
        }

        return response()->json($vehicle);
    }

    public function store(Request $request)
    {
        /*
         * Image is sent as a normal JSON string (data URL), not as a PHP file upload.
         * Therefore this does not depend on upload_tmp_dir, storage links, or a drive path.
         */
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'seats' => ['required', 'integer', 'min:1'],
            'quantity' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:available,unavailable'],
            'image_filename' => ['required', 'string', 'max:255'],
            'image_data' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please check the vehicle information.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $vehicleName = trim($validated['name']);
        $imageFileName = trim($validated['image_filename']);
        $imageBaseName = pathinfo($imageFileName, PATHINFO_FILENAME);
        $extension = strtolower(pathinfo($imageFileName, PATHINFO_EXTENSION));

        $allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];

        if (!in_array($extension, $allowedExtensions, true)) {
            return response()->json([
                'message' => 'Unsupported image format.',
                'errors' => [
                    'image' => ['Only PNG, JPG, JPEG, and WEBP images are allowed.'],
                ],
            ], 422);
        }

        // Keep RideRent's filename convention.
        if ($imageBaseName !== $vehicleName) {
            return response()->json([
                'message' => 'Image filename must exactly match the vehicle name.',
                'errors' => [
                    'image' => ["Please rename the image to {$vehicleName}.{$extension}"],
                ],
            ], 422);
        }

        $dataUrl = $validated['image_data'];

        if (!preg_match('/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s', $dataUrl, $matches)) {
            return response()->json([
                'message' => 'Invalid image data.',
                'errors' => [
                    'image' => ['Please choose a valid PNG, JPG, JPEG, or WEBP image.'],
                ],
            ], 422);
        }

        $declaredMime = $matches[1];
        $encodedImage = $matches[2];
        $binaryImage = base64_decode($encodedImage, true);

        if ($binaryImage === false) {
            return response()->json([
                'message' => 'Invalid image encoding.',
                'errors' => [
                    'image' => ['The selected image could not be decoded.'],
                ],
            ], 422);
        }

        // 2 MB real image limit. Base64 JSON will be slightly larger than this.
        if (strlen($binaryImage) > 2 * 1024 * 1024) {
            return response()->json([
                'message' => 'Image is too large.',
                'errors' => [
                    'image' => ['Please choose an image smaller than 2 MB.'],
                ],
            ], 422);
        }

        $mimeByExtension = [
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
        ];

        $expectedMime = $mimeByExtension[$extension];

        if ($declaredMime !== $expectedMime) {
            return response()->json([
                'message' => 'Image format does not match the filename extension.',
                'errors' => [
                    'image' => ['Please choose an image with the correct file extension.'],
                ],
            ], 422);
        }

        try {
            $vehicle = Car::create([
                'name' => $vehicleName,
                'brand' => trim($validated['brand']),
                'category' => trim($validated['category']),
                'seats' => $validated['seats'],
                'quantity' => $validated['quantity'],
                'price' => $validated['price'],
                'status' => $validated['status'],

                // Existing local images still use this key.
                'image_key' => $vehicleName,

                // New uploaded image lives directly in MySQL.
                'image_data' => $dataUrl,
            ]);

            return response()->json([
                'message' => 'Vehicle and image added successfully.',
                'vehicle' => $vehicle,
            ], 201);
        } catch (Throwable $error) {
            report($error);

            return response()->json([
                'message' => 'Unable to add the vehicle.',
                'error' => $error->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $vehicle = Car::find($id);

        if (!$vehicle) {
            return response()->json([
                'message' => 'Vehicle not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'seats' => ['required', 'integer', 'min:1'],
            'quantity' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'imageKey' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:available,unavailable'],
            'image_filename' => [
                'required_with:image_data',
                'nullable',
                'string',
                'max:255',
            ],
            'image_data' => [
                'required_with:image_filename',
                'nullable',
                'string',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please check the vehicle information.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        $vehicleName = trim($validated['name']);
        $imageKey = trim($validated['imageKey']);

        $updateData = [
            'name' => $vehicleName,
            'brand' => trim($validated['brand']),
            'category' => trim($validated['category']),
            'seats' => $validated['seats'],
            'quantity' => $validated['quantity'],
            'price' => $validated['price'],
            'image_key' => $imageKey,
            'status' => $validated['status'],
        ];

        if (!empty($validated['image_data'])) {
            $imageFileName = trim($validated['image_filename']);
            $imageBaseName = pathinfo($imageFileName, PATHINFO_FILENAME);
            $extension = strtolower(
                pathinfo($imageFileName, PATHINFO_EXTENSION)
            );

            $allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];

            if (!in_array($extension, $allowedExtensions, true)) {
                return response()->json([
                    'message' => 'Unsupported image format.',
                    'errors' => [
                        'image' => [
                            'Only PNG, JPG, JPEG, and WEBP images are allowed.',
                        ],
                    ],
                ], 422);
            }

            if ($imageBaseName !== $imageKey) {
                return response()->json([
                    'message' => 'Image filename must exactly match the Image Key.',
                    'errors' => [
                        'image' => [
                            "Please rename the image to {$imageKey}.{$extension}",
                        ],
                    ],
                ], 422);
            }

            $dataUrl = $validated['image_data'];

            if (!preg_match(
                '/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s',
                $dataUrl,
                $matches
            )) {
                return response()->json([
                    'message' => 'Invalid image data.',
                    'errors' => [
                        'image' => [
                            'Please choose a valid PNG, JPG, JPEG, or WEBP image.',
                        ],
                    ],
                ], 422);
            }

            $declaredMime = $matches[1];
            $encodedImage = $matches[2];
            $binaryImage = base64_decode($encodedImage, true);

            if ($binaryImage === false) {
                return response()->json([
                    'message' => 'Invalid image encoding.',
                    'errors' => [
                        'image' => [
                            'The selected image could not be decoded.',
                        ],
                    ],
                ], 422);
            }

            if (strlen($binaryImage) > 2 * 1024 * 1024) {
                return response()->json([
                    'message' => 'Image is too large.',
                    'errors' => [
                        'image' => [
                            'Please choose an image smaller than 2 MB.',
                        ],
                    ],
                ], 422);
            }

            $mimeByExtension = [
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
            ];

            $expectedMime = $mimeByExtension[$extension];

            if ($declaredMime !== $expectedMime) {
                return response()->json([
                    'message' => 'Image format does not match the filename extension.',
                    'errors' => [
                        'image' => [
                            'Please choose an image with the correct file extension.',
                        ],
                    ],
                ], 422);
            }

            $updateData['image_data'] = $dataUrl;
        }

        try {
            $vehicle->update($updateData);

            return response()->json([
                'message' => 'Vehicle updated successfully.',
                'vehicle' => $vehicle->fresh(),
            ]);
        } catch (Throwable $error) {
            report($error);

            return response()->json([
                'message' => 'Unable to update the vehicle.',
                'error' => $error->getMessage(),
            ], 500);
        }
    }
}