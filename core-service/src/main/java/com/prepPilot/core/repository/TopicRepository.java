package com.prepPilot.core.repository;

import com.prepPilot.core.model.Topic;
import com.prepPilot.core.model.TopicCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TopicRepository extends JpaRepository<Topic, UUID> {

    List<Topic> findAllByCategoryOrderByNameAsc(TopicCategory category);

    boolean existsByNameIgnoreCase(String name);
}