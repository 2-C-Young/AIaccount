package com.coach.spending.service;

import com.coach.spending.model.Transaction;
import com.coach.spending.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromptService {
    
    public String buildPrompt(User user, List<Transaction> transactions, String userQuestion) {
        LocalDate now = LocalDate.now();
        
        // Calculate totals for the current month
        long monthlyIncome = user.getIncome();
        long goalSaving = user.getGoalSaving();
        
        long currentMonthSpending = 0;
        long currentMonthIncome = 0;
        
        StringBuilder transactionListText = new StringBuilder();
        
        for (Transaction t : transactions) {
            boolean isCurrentMonth = t.getTransactionDate().getYear() == now.getYear() && 
                                     t.getTransactionDate().getMonthValue() == now.getMonthValue();
            
            if (isCurrentMonth) {
                if (t.getType() == com.coach.spending.model.TransactionType.SPENDING) {
                    currentMonthSpending += t.getAmount();
                } else {
                    currentMonthIncome += t.getAmount();
                }
            }
            
            transactionListText.append(String.format("- [%s] %s %d원 (%s) - %s\n",
                    t.getTransactionDate(),
                    t.getType() == com.coach.spending.model.TransactionType.INCOME ? "수입" : "지출",
                    t.getAmount(),
                    t.getCategory().name(),
                    t.getMemo() != null ? t.getMemo() : ""
            ));
        }
        
        long remainingBudget = monthlyIncome - goalSaving - currentMonthSpending;

        return String.format(
            "당신은 전문 금융 컨설턴트이자 친절한 AI 소비 코치입니다. 사용자의 소비 패턴을 분석하고 올바른 소비 습관을 위한 조언을 작성해 주세요.\n\n" +
            "[사용자 정보]\n" +
            "- 월 고정 수입: %,d원\n" +
            "- 이번 달 목표 저축액: %,d원\n" +
            "- 이번 달 현재까지 수입: %,d원\n" +
            "- 이번 달 현재까지 지출: %,d원\n" +
            "- 목표 대비 남은 예산(소비 가능한 금액 = 월 수입 - 목표 저축액 - 현재 지출): %,d원\n\n" +
            "[소비/수입 내역 전체 목록]\n" +
            "%s\n" +
            "[사용자 질문]\n" +
            "\"%s\"\n\n" +
            "위의 정보와 소비 내역을 바탕으로 사용자의 질문에 답해 주세요.\n" +
            "답변 지침:\n" +
            "1. 한국어로 친절하고 전문적으로 답변하세요.\n" +
            "2. 구체적인 수치(남은 예산, 지출액 등)를 언급하여 설득력을 높이세요.\n" +
            "3. 소비 습관 개선을 위한 실천적인 팁을 1-2개 포함해 주세요.\n" +
            "4. 마크다운 형식을 적극 활용하여 가독성 있게 구성해 주세요.",
            monthlyIncome, goalSaving, currentMonthIncome, currentMonthSpending, remainingBudget,
            transactionListText.length() > 0 ? transactionListText.toString() : "(내역 없음)\n",
            userQuestion
        );
    }

    public String buildSummaryPrompt(User user, List<Transaction> transactions) {
        LocalDate now = LocalDate.now();
        long monthlyIncome = user.getIncome();
        long currentMonthSpending = 0;
        
        for (Transaction t : transactions) {
            boolean isCurrentMonth = t.getTransactionDate().getYear() == now.getYear() && 
                                     t.getTransactionDate().getMonthValue() == now.getMonthValue();
            if (isCurrentMonth && t.getType() == com.coach.spending.model.TransactionType.SPENDING) {
                currentMonthSpending += t.getAmount();
            }
        }
        
        return String.format(
            "사용자의 이번 달 수입은 %,d원이고, 지출은 %,d원이며, 목표 저축액은 %,d원입니다. " +
            "이 정보를 바탕으로 전문 자산 관리사 관점에서 아래 형식에 맞춰 오직 '정확히 2줄의 문장'으로 조언을 작성해 주세요. 다른 서론이나 부연 설명은 절대 하지 마세요.\n\n" +
            "1번째 줄: 현재 사용자의 소비 상태가 어떤지 객체적인 수치를 들어 평가합니다.\n" +
            "2번째 줄: 목표 저축액 달성을 위해 앞으로 소비를 어떻게 통제하고 대처해야 하는지 구체적인 가이드를 제공합니다.",
            monthlyIncome, currentMonthSpending, user.getGoalSaving()
        );
    }

    public String buildReportPrompt(User user, List<Transaction> transactions, String persona) {
        LocalDate now = LocalDate.now();
        long monthlyIncome = user.getIncome();
        long goalSaving = user.getGoalSaving();
        long currentMonthSpending = 0;
        long currentMonthIncome = 0;
        
        StringBuilder transactionListText = new StringBuilder();
        
        for (Transaction t : transactions) {
            boolean isCurrentMonth = t.getTransactionDate().getYear() == now.getYear() && 
                                     t.getTransactionDate().getMonthValue() == now.getMonthValue();
            
            if (isCurrentMonth) {
                if (t.getType() == com.coach.spending.model.TransactionType.SPENDING) {
                    currentMonthSpending += t.getAmount();
                } else {
                    currentMonthIncome += t.getAmount();
                }
            }
            
            transactionListText.append(String.format("- [%s] %s %d원 (%s) [만족도: %s] - %s\n",
                    t.getTransactionDate(),
                    t.getType() == com.coach.spending.model.TransactionType.INCOME ? "수입" : "지출",
                    t.getAmount(),
                    t.getCategory().name(),
                    t.getSatisfaction() != null ? t.getSatisfaction().name() : "NORMAL",
                    t.getMemo() != null ? t.getMemo() : ""
            ));
        }
        
        long remainingBudget = monthlyIncome - goalSaving - currentMonthSpending;

        // Choose persona instructions
        String personaInstruction = "";
        if ("SPICY".equalsIgnoreCase(persona)) {
            personaInstruction = 
                "성격 및 어조: '매운맛 코치 (거지방 감성)'\n" +
                "- 불합리한 소비나 잦은 낭비, 특히 본인이 '후회(REGRET)'라고 기록한 지출을 보면 반말로 강하게 팩트 폭행을 하세요.\n" +
                "- 칭찬은 매우 인색하게 하되, 정말 아낀 부분이 있다면 츤데레처럼 슬쩍 인정해주세요.\n" +
                "- 사투리는 절대 사용하지 마세요. 표준어로 차갑고 매섭게, 따끔하게 뼈를 때리는 직설적인 반말투를 사용하세요.";
        } else if ("SWEET".equalsIgnoreCase(persona)) {
            personaInstruction = 
                "성격 및 어조: '우아한 프리미엄 코치 (VIP PB 감성)'\n" +
                "- 최고급 프라이빗 뱅커(PB)나 럭셔리 컨시어지처럼 정중하고 매우 품위 있는 격식체 존댓말을 사용하세요.\n" +
                "- 사용자가 아낀 부분이나 가치 있는 지출(SATISFIED)에 대해 '교양 있고 품격 있는 소비'라며 지지하고 칭찬하세요.\n" +
                "- 낭비성 지출(REGRET)에 대해서도 감정적으로 다그치지 않고, 품위를 잃지 않는 어조로 지혜롭고 점잖게 절제를 유도하며 품격 있는 대안을 제시하세요.";
        } else if ("INVESTOR".equalsIgnoreCase(persona)) {
            personaInstruction = 
                "성격 및 어조: '워렌 버핏 자산가 코치'\n" +
                "- 매우 냉철하고 전문적인 재테크 컨설턴트 톤앤매너(존댓말)를 사용하세요.\n" +
                "- 낭비성 지출을 기회비용(예: '이 돈을 연 복리 8%% 미국 배당주에 투자했다면 10년 뒤 얼마')으로 환산하여 수치로 보여주세요.\n" +
                "- 포트폴리오 다각화 및 실천 가능한 자산 축적 조언을 조리 있게 제공하세요.";
        }

        return String.format(
            "당신은 전문 금융 컨설턴트이자 지정된 성향을 가진 AI 소비 코치입니다. 사용자의 소비 패턴을 종합 분석하여 이번 달 소비 분석 총평 리포트를 작성해 주세요.\n\n" +
            "[사용자 정보]\n" +
            "- 월 고정 수입: %,d원\n" +
            "- 이번 달 목표 저축액: %,d원\n" +
            "- 이번 달 현재까지 수입: %,d원\n" +
            "- 이번 달 현재까지 지출: %,d원\n" +
            "- 목표 대비 남은 예산(소비 가능한 금액 = 월 수입 - 목표 저축액 - 현재 지출): %,d원\n" +
            "- 장기 저축 목표: %s\n\n" +
            "[소비/수입 내역 전체 목록 (만족도 정보 포함)]\n" +
            "%s\n" +
            "[코치 성격 정보]\n" +
            "%s\n\n" +
            "위의 정보와 소비 내역을 바탕으로 사용자의 소비 총평 리포트를 마크다운 형식을 사용하여 작성해 주세요.\n" +
            "반드시 아래의 구조와 목차를 정확하게 지켜서 작성해야 합니다.\n\n" +
            "## [이번 달 소비 리포트]\n\n" +
            "### 📊 소비 만족 점수: [0~100 사이의 점수]점\n" +
            "- 사용자의 저축 목표 달성도, 수입 대비 지출 비율, 그리고 사용자가 직접 매긴 만족도(만족/후회 비율)를 고려하여 냉정하게 계산한 점수와 코치의 한 줄 총평을 써주세요.\n\n" +
            "### 👍 칭찬할 소비 (Best)\n" +
            "- 지출 내역 중 사용자가 '만족(SATISFIED)'으로 표기했거나 카테고리/목적상 가장 생산적이고 합리적이었던 지출 1~2개를 꼽아 칭찬해주세요. 구체적인 날짜, 가게명, 금액을 명시하세요.\n\n" +
            "### 👎 아쉬운 소비 (Worst)\n" +
            "- 지출 내역 중 사용자가 '후회(REGRET)'로 표기했거나 과도한 낭비/충동구매였던 지출 1~2개를 콕 집어 지적하세요. 구체적인 날짜, 가게명, 금액을 명시하세요.\n\n" +
            "### 🌟 지출 쏠림 및 누수 분석\n" +
            "- 개별 건 외에, 이번 달 소비 패턴의 근본적인 문제점(예: 특정 카테고리에 예산의 50%% 이상이 쏠림, 혹은 5천원 이하 소액 카페/편의점 결제가 너무 잦아 총액이 누수됨 등)을 짚어내어 분석하세요.\n\n" +
            "### 🔮 장기 자산 성장 솔루션\n" +
            "- 사용자의 장기 저축 목표인 '%s'와 현재 월 저축 페이스를 비교하여 목표 달성 가능 여부를 분석해 주세요. 목표 달성을 위해 '어떤 카테고리에서 돈을 더 아껴야 하는지' 또는 현재 예산 통제가 훌륭하여 '어느 영역에서는 조금 더 지출해도 무리가 없는지'를 딱 2~3줄의 간결한 요약으로 권장해 주세요.\n\n" +
            "답변 지침:\n" +
            "- 반드시 지정된 코치 성향의 말투와 어조를 적용하여 대화하듯 작성하세요.\n" +
            "- 구체적인 수치와 거래명을 정확히 인용해 가독성 높은 마크다운 형식으로 출력하세요.",
            monthlyIncome, goalSaving, currentMonthIncome, currentMonthSpending, remainingBudget,
            (user.getTargetPeriodMonths() != null && user.getTargetAmount() != null)
                ? String.format("%d년 %d개월 동안 %,d원 모으기", user.getTargetPeriodMonths() / 12, user.getTargetPeriodMonths() % 12, user.getTargetAmount())
                : "5년 0개월 동안 30,000,000원 모으기",
            transactionListText.length() > 0 ? transactionListText.toString() : "(내역 없음)\n",
            personaInstruction,
            (user.getTargetPeriodMonths() != null && user.getTargetAmount() != null)
                ? String.format("%d년 %d개월 동안 %,d원 모으기", user.getTargetPeriodMonths() / 12, user.getTargetPeriodMonths() % 12, user.getTargetAmount())
                : "5년 0개월 동안 30,000,000원 모으기"
        );
    }

    public String buildChatPrompt(User user, List<Transaction> transactions, String userQuestion, String persona, String currentReport) {
        String baseContext = buildReportPrompt(user, transactions, persona);
        
        return String.format(
            "%s\n\n" +
            "---[이전 분석 리포트 내용]---\n" +
            "%s\n\n" +
            "---[사용자의 추가 질문]---\n" +
            "\"%s\"\n\n" +
            "위의 분석 리포트 내용과 사용자의 질문을 바탕으로 후속 조언을 해주세요.\n" +
            "지침:\n" +
            "1. 반드시 선택된 코치 성향('%s')의 말투를 일관되게 사용하세요.\n" +
            "2. 리포트의 맥락을 인지하고 대화형으로 친절하거나 매콤하게 답변해 주세요.",
            baseContext,
            currentReport != null ? currentReport : "(생성된 리포트 없음)",
            userQuestion,
            persona
        );
    }
}
