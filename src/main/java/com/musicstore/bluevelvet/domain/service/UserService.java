package com.musicstore.bluevelvet.domain.service;
import com.musicstore.bluevelvet.infrastructure.entity.User;
import com.musicstore.bluevelvet.infrastructure.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service // 1. Indica ao Spring que esta classe contém lógica de negócio
public class UserService {

    @Autowired // 2. Injeta o repositório para podermos falar com o banco
    private UserRepository repository;

    // Método para buscar TODOS os utilizadores
    public List<User> findAll() {
        return repository.findAll();
    }

    // Método para buscar UM utilizador por ID
    public User findById(Long id) {
        Optional<User> obj = repository.findById(id);
        // Retorna o objeto se existir, ou lança um erro genérico se não encontrar
        return obj.orElseThrow(() -> new RuntimeException("Utilizador não encontrado!"));
    }
}