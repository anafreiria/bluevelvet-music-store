package com.musicstore.bluevelvet.infrastructure.repository;

import com.musicstore.bluevelvet.infrastructure.entity.BoxDimension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BoxDimensionRepository extends JpaRepository<BoxDimension, Long> {

}
