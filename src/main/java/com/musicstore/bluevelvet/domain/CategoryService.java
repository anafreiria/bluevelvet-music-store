package com.musicstore.bluevelvet.domain;

import com.musicstore.bluevelvet.infrastructure.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repository;

    public Page<Category> listCategories(int page, String sortDirection) {

        // CORREÇÃO: Usa o operador ternário para atribuir o valor FINAL em uma única linha.
        // Isso garante que 'sortCriteria' seja final e evita o erro do compilador.
        final Sort sortCriteria = sortDirection.equalsIgnoreCase("DESC")
                ? Sort.by("name").descending()
                : Sort.by("name");

        Pageable pageable = PageRequest.of(page, 5, sortCriteria);

        // 1. Carrega categorias principais
        Page<Category> mainCats = repository.findByParentCategoryIsNull(pageable);

        // 2. Carrega subcategorias, aplicando a mesma ordenação
        mainCats.forEach(cat -> {
            // Agora, 'sortCriteria' é FINAL e não causa mais erro
            List<Category> children = repository.findByParentCategoryId(cat.getId(), sortCriteria);
            cat.setChildren(children);
        });

        return mainCats;
    }
}