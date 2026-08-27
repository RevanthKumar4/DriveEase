package com.examly.springapp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

@Data
public class LoginDTO {

    private Long userId;

    /*
     * Used internally to create the HttpOnly cookie.
     * It is never included in JSON responses.
     */
    @JsonIgnore
    private String token;

    private String username;

    private String userRole;
}