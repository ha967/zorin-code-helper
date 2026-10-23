package com.example.zorincodehelper.controller.dto;

import java.util.List;

/** 追问建议；生成失败时返回空列表，前端不展示即可。 */
public record SuggestionsResponse(List<String> questions) {
}
