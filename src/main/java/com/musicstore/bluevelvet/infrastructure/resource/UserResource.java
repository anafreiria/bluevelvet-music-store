package com.musicstore.bluevelvet.infrastructure.resource;
import com.musicstore.bluevelvet.domain.service.UserService;
import com.musicstore.bluevelvet.infrastructure.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController // 1. Diz ao Spring que esta classe vai responder a requisições Web
@RequestMapping(value = "/users") // 2. Define o caminho (endpoint):
public class UserResource {

    @Autowired
    private UserService service;

    // Endpoint para buscar TODOS os utilizadores
    @GetMapping
    public ResponseEntity<List<User>> findAll() {
        List<User> list = service.findAll();
        // Retorna código 200 (OK) e a lista no corpo da resposta
        return ResponseEntity.ok().body(list);
    }

    // Endpoint para buscar UM utilizador por ID
    @GetMapping(value = "/{id}")
    public ResponseEntity<User> findById(@PathVariable Long id) {
        User obj = service.findById(id);
        return ResponseEntity.ok().body(obj);
    }
}