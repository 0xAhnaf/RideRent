<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class RagAgentController extends Controller
{
    /**
     * Send a user question to the LangGraph RAG service.
     *
     * The OpenRouter API key stays inside the Python RAG service.
     * React only talks to Laravel.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:4000'],
            'history' => ['nullable', 'array', 'max:8'],
            'history.*.role' => ['required', 'string', 'in:user,assistant'],
            'history.*.content' => ['required', 'string', 'max:8000'],
        ]);

        $ragUrl = rtrim(
            config('services.rag.url', 'http://127.0.0.1:8001'),
            '/'
        );

        try {
            $response = Http::timeout(90)
                ->acceptJson()
                ->post($ragUrl . '/chat', [
                    'question' => $validated['question'],
                    'history' => $validated['history'] ?? [],
                ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json([
                'message' => $response->json('detail')
                    ?? 'The AI assistant could not answer right now.',
            ], $response->status() >= 500 ? 503 : $response->status());

        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'The AI assistant service is currently unavailable.',
            ], 503);
        }
    }
}