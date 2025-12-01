package com.musicstore.bluevelvet.infrastructure;

import com.musicstore.bluevelvet.domain.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {





    // Lista categorias ordenadas ascendentemente,
    // priorizando categorias que NÃO têm pai.
    @Query("""
           SELECT c FROM Category c
           ORDER BY 
               CASE WHEN c.parentCategory IS NULL THEN 0 ELSE 1 END,
               c.name ASC
           """)
    Page<Category> findAllTopLevelSortedAsc(Pageable pageable);

    // Mesma lógica, mas agora ordena descendentemente
    @Query("""
           SELECT c FROM Category c
           ORDER BY 
               CASE WHEN c.parentCategory IS NULL THEN 0 ELSE 1 END,
               c.name DESC
           """)
    Page<Category> findAllTopLevelSortedDesc(Pageable pageable);
}
