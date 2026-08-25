import {
  Button,
  ButtonType,
  Column,
  ColumnAlign,
  ColumnJustify,
  IconButton,
  Row,
  RowAlign,
} from "@common/components";
import styles from "./styles.module.css";

export function NotesPage() {
  return (
    <Column
      align={ColumnAlign.Center}
      className={styles.page}
      justify={ColumnJustify.Center}
    >
      <Row align={RowAlign.Center}>
        <Button type={ButtonType.Regular} onClick={() => {}}>
          Click me
        </Button>
        <IconButton iconName="search" onClick={() => {}} ariaLabel="Search" />
      </Row>
    </Column>
  );
}
