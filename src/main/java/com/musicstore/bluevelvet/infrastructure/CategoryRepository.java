package com.musicstore.bluevelvet.infrastructure;

import com.musicstore.bluevelvet.domain.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort; // <-- NOVA IMPORTAÇÃO

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Busca apenas categorias principais (parent NULL)
    Page<Category> findByParentCategoryIsNull(Pageable pageable);

    // MODIFICADO: Busca subcategorias de um parent_id específico, aplicando classificação
    List<Category> findByParentCategoryId(Long parentId, Sort sort);
}