from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


def normalize_database_url(database_url: str | None) -> str | None:
    if not database_url:
        return database_url

    parts = urlsplit(database_url)
    query_params = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if key != "schema"
    ]
    return urlunsplit(
        (
            parts.scheme,
            parts.netloc,
            parts.path,
            urlencode(query_params),
            parts.fragment,
        )
    )
