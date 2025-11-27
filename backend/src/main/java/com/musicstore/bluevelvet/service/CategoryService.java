package com.musicstore.bluevelvet.domain.service; // Ajuste se necessário

import com.musicstore.bluevelvet.infrastructure.entity.Category;
import com.musicstore.bluevelvet.infrastructure.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repo;

    public Category save(Category category) {
        // Regra de Negócio: Verificar duplicidade
        Category existing = repo.findByName(category.getName());

        if (existing != null) {
            // Se já existe uma com esse nome, lança um erro ( que o Controller vai pegar)
            throw new IllegalArgumentException("Já existe uma categoria com o nome: " + category.getName());
        }

        return repo.save(category);
    }
}