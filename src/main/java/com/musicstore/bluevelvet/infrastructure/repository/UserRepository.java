package com.musicstore.bluevelvet.infrastructure.repository;


import com.musicstore.bluevelvet.infrastructure.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    // Busca o usuário pelo email para validação de login
    User findByEmail(String email);
}