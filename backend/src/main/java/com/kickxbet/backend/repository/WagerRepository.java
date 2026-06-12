package com.kickxbet.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.stereotype.Repository;
import com.kickxbet.backend.model.Wager;

public interface WagerRepository extends JpaRepository<Wager, Long> {
    List<Wager> findByUsername(String username);
}
