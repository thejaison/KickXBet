package com.kickxbet.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.stereotype.Repository;
import com.kickxbet.backend.model.Match;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByLeague(String league);
}
