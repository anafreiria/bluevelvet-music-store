package com.musicstore.bluevelvet.domain;

import com.musicstore.bluevelvet.infrastructure.CategoryRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
public class CategoryService {

    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    // Método para listar categorias com paginação e ordenação
    public Page<Category> listPaginated(int page, String sort) {

        // Define tamanho da página (5 itens por página)
        Pageable pageable = PageRequest.of(page, 5);

        // Verifica se a ordenação é descendente
        if ("desc".equalsIgnoreCase(sort)) {
            return repository.findAllTopLevelSortedDesc(pageable);
        }

        // Caso contrário, ordenação ascendente
        return repository.findAllTopLevelSortedAsc(pageable);
    }
}
