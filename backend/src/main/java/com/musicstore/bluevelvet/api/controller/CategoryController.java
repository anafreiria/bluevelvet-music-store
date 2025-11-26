package com.musicstore.bluevelvet.api;

import com.musicstore.bluevelvet.domain.service.CategoryService;
import com.musicstore.bluevelvet.infrastructure.entity.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories") // O endereço base
@CrossOrigin(origins = "*") // Libera o acesso p HTML/JS local
public class CategoryController {

    @Autowired
    private CategoryService service;

    @PostMapping // Responde ao método POST
    public ResponseEntity<?> create(@RequestBody Category category) {
        try {
            Category saved = service.save(category);
            return new ResponseEntity<>(saved, HttpStatus.CREATED); // Retorna 201 (Sucesso)

        } catch (IllegalArgumentException e) {
            // Retorna 400 (Erro do cliente) e a mensagem de erro
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}