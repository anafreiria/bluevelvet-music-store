package com.musicstore.bluevelvet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@EnableJpaRepositories
@SpringBootApplication
public class BluevelvetApplication {

	public static void main(String[] args) {
		SpringApplication.run(BluevelvetApplication.class, args);
	}

}
