package com.example.zorincodehelper.controller.dto;

import java.util.List;

public record ChatHistoryResponse(int memoryId, List<HistoryMessage> messages) {
}
