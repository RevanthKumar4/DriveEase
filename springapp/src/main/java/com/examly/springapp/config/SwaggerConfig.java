package com.examly.springapp.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI driveEaseOpenAPI() {
        Contact teamContact = new Contact();
        teamContact.setName("DriveEase Team");

        return new OpenAPI()
            .info(new Info()
                .title("DriveEase API")
                .version("1.0.0")
                .description(
                    "REST API documentation for DriveEase — " +
                    "an all-in-one platform for booking professional drivers.\n\n" +
                    "**Authentication**: Cookie-based JWT (HttpOnly `DriveEase-JWT` cookie)\n\n" +
                    "**Roles**: `admin`, `customer`"
                )
                .contact(teamContact));
    }
}