package com.examly.springapp.exceptions;

public class DuplicateDriverException extends Exception {
    DuplicateDriverException(String message) {
        super(message);
    }
}
