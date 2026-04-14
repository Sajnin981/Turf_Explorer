package com.turfexplorer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TurfSuggestionResponse {
    private Long id;
    private String name;
}
