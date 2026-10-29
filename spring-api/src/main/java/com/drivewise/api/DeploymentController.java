package com.drivewise.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DeploymentController {
    @GetMapping("/")
    public String home() {
        return "Spring Boot Application Deployed Successfully";
    }
}
