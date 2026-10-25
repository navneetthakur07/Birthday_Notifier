package com.birthdaynotifier;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BirthdayNotifierApplication {

    public static void main(String[] args) {
        SpringApplication.run(BirthdayNotifierApplication.class, args);
    }
}
