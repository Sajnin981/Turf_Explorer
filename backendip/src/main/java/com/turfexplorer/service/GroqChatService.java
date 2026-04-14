package com.turfexplorer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GroqChatService {

    private static final Logger logger = LoggerFactory.getLogger(GroqChatService.class);

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant";
    private static final String SYSTEM_PROMPT = "You are the friendly customer support assistant for Turf Explorer, a sports turf booking platform. Keep answers concise, helpful, and under 3 sentences.";
    private static final String FALLBACK_REPLY = "I can help with booking, confirmation, owner/admin tasks, and platform support. Please try asking your question in a different way.";
    private static final String AI_ERROR_REPLY = "AI Error: Could not connect to Groq.";
    private static final String AI_KEY_MISSING_REPLY = "AI Error: Groq API key is not configured.";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key:YOUR_API_KEY_HERE}")
    private String groqApiKey;

    public GroqChatService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String getAiResponse(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return FALLBACK_REPLY;
        }

        if (groqApiKey == null || groqApiKey.isBlank() || "YOUR_API_KEY_HERE".equals(groqApiKey)) {
            return AI_KEY_MISSING_REPLY;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + groqApiKey);

            Map<String, Object> payload = Map.of(
                    "model", MODEL,
                    "messages", List.of(
                            Map.of("role", "system", "content", SYSTEM_PROMPT),
                            Map.of("role", "user", "content", userMessage.trim())
                    )
            );

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(GROQ_API_URL, requestEntity, String.class);

            String body = response.getBody();
            if (body == null || body.isBlank()) {
                return AI_ERROR_REPLY;
            }

            JsonNode root = objectMapper.readTree(body);
            JsonNode contentNode = root.path("choices")
                    .path(0)
                    .path("message")
                    .path("content");

            if (contentNode.isMissingNode() || contentNode.asText().isBlank()) {
                return AI_ERROR_REPLY;
            }

            return contentNode.asText().trim();
        } catch (HttpStatusCodeException ex) {
            logger.error("Groq API request failed", ex);
            String apiError = extractApiErrorMessage(ex.getResponseBodyAsString());
            if (apiError != null) {
                return "AI Error: " + apiError;
            }
            return "AI Error: Groq request failed with status " + ex.getStatusCode().value() + ".";
        } catch (ResourceAccessException ex) {
            logger.error("Network issue while connecting to Groq", ex);
            return "AI Error: Network issue while connecting to Groq.";
        } catch (Exception ex) {
            logger.error("Unexpected error while processing Groq response", ex);
            return AI_ERROR_REPLY;
        }
    }

    private String extractApiErrorMessage(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }

        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode messageNode = root.path("error").path("message");
            if (messageNode.isMissingNode() || messageNode.asText().isBlank()) {
                return null;
            }
            return messageNode.asText().trim();
        } catch (Exception ignored) {
            return null;
        }
    }
}