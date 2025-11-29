package com.musicstore.bluevelvet.infrastructure;

import com.musicstore.bluevelvet.domain.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Busca apenas categorias principais (parent NULL)
    Page<Category> findByParentCategoryIsNull(Pageable pageable);

    List<Category> findByParentCategoryId(Long parentId, Sort sort);
}