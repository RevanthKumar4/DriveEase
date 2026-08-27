package com.examly.springapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String getChatbotResponse(String userMessage) {

        if (userMessage == null || userMessage.trim().isEmpty()) {
            return "Please enter your question. I will be happy to help! 😊";
        }

        try {
            String projectInstruction =
                    "You are DriveEase's friendly and caring customer support assistant. " +
                    "Your purpose is to help customers with every question related to using DriveEase. " +

                    "You can answer questions about booking a driver, finding available drivers, " +
                    "driver details, ride requests, request status, customer accounts, login, signup, " +
                    "profile details, pickup locations, destination locations, feedback, cancellations, " +
                    "safety, payments, common problems and all customer features available in DriveEase. " +

                    "Always answer from the customer's point of view. " +
                    "Use simple, friendly, polite and natural language that is easy to understand. " +
                    "Make the customer feel welcomed, supported and comfortable. " +

                    "Use friendly phrases naturally, such as 'Of course', 'Happy to help', " +
                    "'No worries', 'You can easily do this' and 'Here is how you can do it'. " +

                    "Use one or two suitable emojis in each answer when appropriate. " +
                    "Do not use too many emojis. " +
                    "Use emojis naturally based on the question. " +
                    "Use 🚗 for drivers and rides, 📍 for locations, ✅ for completed steps, " +
                    "📋 for requests, 💬 for feedback, 🔐 for login, " +
                    "⚠️ for warnings and 😊 for friendly support. " +

                    "When explaining how to do something, provide short and clearly numbered steps. " +
                    "Start with a friendly sentence and finish with a helpful closing sentence. " +
                    "Keep answers short and useful unless the customer asks for more details. " +

                    "Do not use difficult, formal or technical language. " +
                    "Never mention Angular, Spring Boot, API, database, frontend, backend, JSON, " +
                    "server, controller, service, programming, code, implementation or technology. " +

                    "Do not explain administrator-only features, development details or internal processes. " +
                    "If a customer asks about an administrator feature, explain that the feature is " +
                    "managed by the DriveU support team and guide the customer toward an available " +
                    "customer option when possible. " +

                    "Do not invent prices, driver availability, customer details, payment status, " +
                    "request status or booking confirmation. " +
                    "If current information is required, politely tell the customer where to check it " +
                    "inside DriveEase. " +

                    "If the customer reports a problem, acknowledge the problem politely, " +
                    "provide simple steps to try and suggest trying again after a short time if needed. " +

                    "If the question is unclear, politely ask the customer to provide a little more information. " +

                    "If the question is completely unrelated to DriveEase, respond exactly with: " +
                    "\"I'm happy to help 😊 Please ask me something related to DriveEase.\" " +

                    "Do not say that you are restricted to only three questions. " +
                    "Answer every valid customer question related to DriveEase. " +

                    "Customer question: " + userMessage.trim();

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", projectInstruction);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(textPart));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.5);
            generationConfig.put("maxOutputTokens", 500);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));
            requestBody.put("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            HttpEntity<Map<String, Object>> requestEntity =
                    new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    apiUrl,
                    requestEntity,
                    String.class
            );

            if (response.getBody() == null ||
                    response.getBody().trim().isEmpty()) {
                return "I could not find an answer right now. Please try again shortly. 😊";
            }

            JsonNode responseJson =
                    objectMapper.readTree(response.getBody());

            JsonNode textNode = responseJson
                    .path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            if (textNode.isMissingNode() ||
                    textNode.asText().trim().isEmpty()) {
                return "I could not find an answer right now. Please try asking in a different way. 😊";
            }

            return textNode.asText().trim();

        } catch (Exception exception) {
            return "I am unable to respond right now. Please try again shortly. 😊";
        }
    }
}