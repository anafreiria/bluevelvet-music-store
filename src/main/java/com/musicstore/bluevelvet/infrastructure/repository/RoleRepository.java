package com.musicstore.bluevelvet.infrastructure.repository;

import com.musicstore.bluevelvet.infrastructure.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    // O Spring cria o SQL automaticamente baseado no nome deste método
    Optional<Role> findByAuthority(String authority);
}