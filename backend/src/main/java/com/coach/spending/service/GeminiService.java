package com.coach.spending.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiService {

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String callGemini(String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "⚠️ **[안내] Gemini API Key가 설정되지 않았습니다.**\n\n" +
                   "서버 실행 환경에서 `GEMINI_API_KEY` 환경 변수를 설정하시거나, " +
                   "`application.yml` 파일에 API Key를 등록하여 실시간 AI 피드백을 활성화하세요.\n\n" +
                   "*임시 응답: 사용자의 월 소비 내역과 질문이 정상적으로 전달되었습니다.*";
        }

        try {
            String url = apiUrl + "?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Request body mapping
            Map<String, Object> requestBody = new HashMap<>();
            
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            
            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));
            
            requestBody.put("contents", Collections.singletonList(content));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                List candidates = (List) body.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map candidate = (Map) candidates.get(0);
                    Map responseContent = (Map) candidate.get("content");
                    if (responseContent != null) {
                        List parts = (List) responseContent.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            Map partObj = (Map) parts.get(0);
                            return (String) partObj.get("text");
                        }
                    }
                }
            }
            return "Gemini API 응답을 파싱할 수 없습니다.";
        } catch (Exception e) {
            return "Gemini API 호출 중 오류가 발생했습니다: " + e.getMessage();
        }
    }
}
