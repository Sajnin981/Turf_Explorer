package com.turfexplorer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TurfExplorerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TurfExplorerApplication.class, args);
    }
}
