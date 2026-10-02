import pytest

from scripts import provision_admin


def test_password_prompt_requires_matching_hidden_values(monkeypatch):
    values = iter(("a" * 12, "b" * 12))
    monkeypatch.setattr(provision_admin, "getpass", lambda _prompt: next(values))

    with pytest.raises(ValueError, match="do not match"):
        provision_admin._prompt_password()


def test_password_prompt_accepts_valid_hidden_values(monkeypatch):
    password = "a" * 12
    values = iter((password, password))
    monkeypatch.setattr(provision_admin, "getpass", lambda _prompt: next(values))

    assert provision_admin._prompt_password() == password
