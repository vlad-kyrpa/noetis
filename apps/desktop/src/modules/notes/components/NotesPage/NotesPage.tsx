import {
  Button,
  ButtonType,
  Column,
  ColumnAlign,
  ColumnJustify,
  Row,
  RowAlign,
} from "@common/components";
import styles from "./styles.module.css";

// Hosts the main notes workspace content.
export function NotesPage(): JSX.Element {
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
      </Row>
    </Column>
  );
}
