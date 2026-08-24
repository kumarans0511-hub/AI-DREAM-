import json
import os
from pathlib import Path

DEFAULT_SETTINGS = {
    # Model Configuration
    "primary_llm": "llama3.1",
    "memory_storage_engine": "ChromaDB",
    "embedding_model": "all-MiniLM-L6-v2",
    
    # Memory Configuration
    "retrieval_top_k": 5,
    "similarity_threshold": 0.75,
    "max_context_memories": 10,
    
    # Dream Scheduler
    "consolidation_interval_seconds": 3600,
    "dry_run_mode": True,
    "automatic_dreaming": True,
    "reflection_frequency": "Daily",
    
    # Consolidation Configuration
    "consolidation_strategy": "Semantic Clustering",
    "memory_importance_threshold": 0.70,
    
    # Forgetting Mechanism
    "enable_memory_decay": True,
    "decay_rate": 0.05,
    "minimum_memory_strength": 0.20,
    "archive_forgotten_memories": True,
    
    # LLM Configuration
    "temperature": 0.7,
    "max_tokens": 2048,
    "response_timeout": 120
}

class SettingsManager:
    """
    Lightweight configuration manager that persists settings to memory_db/settings.json
    so they survive container restarts alongside the database.
    """
    def __init__(self, filepath: str = "memory_db/settings.json"):
        self.filepath = Path(filepath)
        self.settings = self._load()
        
    def _load(self) -> dict:
        if self.filepath.exists():
            try:
                with open(self.filepath, 'r') as f:
                    data = json.load(f)
                    # Merge with defaults to ensure all keys exist
                    merged = DEFAULT_SETTINGS.copy()
                    merged.update(data)
                    return merged
            except Exception as e:
                print(f"[SettingsManager] Error loading settings: {e}")
                return DEFAULT_SETTINGS.copy()
        else:
            return DEFAULT_SETTINGS.copy()
            
    def get_all(self) -> dict:
        return self.settings
        
    def save(self, new_settings: dict) -> bool:
        # Merge new settings with existing
        self.settings.update(new_settings)
        try:
            # Ensure directory exists
            self.filepath.parent.mkdir(parents=True, exist_ok=True)
            with open(self.filepath, 'w') as f:
                json.dump(self.settings, f, indent=4)
            return True
        except Exception as e:
            print(f"[SettingsManager] Error saving settings: {e}")
            return False
